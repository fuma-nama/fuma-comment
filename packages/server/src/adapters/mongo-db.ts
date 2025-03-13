import { type Db, ObjectId } from "mongodb";
import type { StorageAdapter, StorageAuthProvider } from "../adapter";
import type { UserProfile } from "../types";

interface CommentType {
    page: string;
    thread?: ObjectId | null;
    author: string;
    content: object;
    timestamp: Date;
}

interface RateType {
    commentId: ObjectId;
    userId: string;
    like: boolean;
}

interface RoleType {
    userId: string;
    name: string;
    canDelete: boolean;
}

export function createMongoDBAdapter({
    db,
    RateCollection = "rate",
    CommentCollection = "comment",
    RoleCollection = "role",
    ...options
}: {
    db: Db;
    auth: "better-auth" | "next-auth" | StorageAuthProvider;
    RateCollection?: string;
    CommentCollection?: string;
    RoleCollection?: string;
}): StorageAdapter {
    const auth =
        typeof options.auth === "string"
            ? createGenericProvider(db, options.auth)
            : options.auth;

    return {
        async getComments({
            sort,
            page,
            after,
            thread,
            before,
            limit,
            ...options
        }) {
            const result = await db
                .collection<CommentType>(CommentCollection)
                .aggregate<
                    CommentType & {
                        _id: ObjectId;
                        likes: number;
                        dislikes: number;
                        replies: number;
                    }
                >([
                    {
                        $match: {
                            page,
                            thread: thread ? new ObjectId(thread) : null,
                        },
                    },
                    {
                        $lookup: {
                            from: RateCollection,
                            localField: "_id",
                            foreignField: "commentId",
                            as: "rates",
                            pipeline: [
                                {
                                    $group: {
                                        _id: "$_id",
                                        likes: {
                                            $sum: {
                                                $cond: ["$like", 1, 0],
                                            },
                                        },
                                        dislikes: {
                                            $sum: {
                                                $cond: ["$like", 0, 1],
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: RateCollection,
                            localField: "_id",
                            foreignField: "commentId",
                            as: "selfRate",
                            pipeline: [
                                {
                                    $match: {
                                        userId: options.auth?.id ?? null,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $lookup: {
                            from: CommentCollection,
                            localField: "_id",
                            foreignField: "thread",
                            as: "reply",
                        },
                    },
                    {
                        $addFields: {
                            replies: { $size: "$reply" },
                            likes: { $first: "$rates.likes" },
                            dislikes: { $first: "$rates.dislikes" },
                            liked: { $first: "$selfRate.like" },
                        },
                    },
                    {
                        $unset: ["reply", "rates", "selfRate"],
                    },
                    {
                        $sort: {
                            timestamp: sort === "newest" ? -1 : 1,
                        },
                    },
                ])
                .limit(limit)
                .toArray();

            const users = await auth.getUsers(result.map((v) => v.author));
            return result.map(({ _id, thread, ...v }) => ({
                ...v,
                likes: v.likes ?? 0,
                dislikes: v.dislikes ?? 0,
                id: _id.toString(),
                threadId: thread?.toString(),
                author: users.find((u) => u.id === v.author) ?? {
                    id: v.author,
                    name: "Deleted User",
                },
            }));
        },
        async postComment(options) {
            const value: CommentType = {
                page: options.page,
                author: options.auth.id,
                content: options.body.content,
                timestamp: new Date(Date.now()),
                thread: options.body.thread ? new ObjectId(options.body.thread) : null,
            };

            const result = await db
                .collection<CommentType>(CommentCollection)
                .insertOne(value);
            const { thread, ...rest } = value;

            return {
                id: result.insertedId.toString(),
                ...rest,
                threadId: thread?.toString(),
                author: (await auth.getUsers([options.auth.id]))[0],
                likes: 0,
                dislikes: 0,
                replies: 0,
            };
        },
        async setRate(options) {
            await db.collection<RateType>(RateCollection).updateOne(
                {
                    commentId: new ObjectId(options.id),
                    userId: options.auth.id,
                },
                {
                    $set: {
                        like: options.body.like,
                        commentId: new ObjectId(options.id),
                        userId: options.auth.id,
                    },
                },
                {
                    upsert: true,
                },
            );
        },
        async deleteRate(options) {
            await db.collection<RateType>(RateCollection).deleteOne({
                commentId: new ObjectId(options.id),
                userId: options.auth.id,
            });
        },
        async updateComment(options) {
            await db.collection<CommentType>(CommentCollection).updateOne(
                {
                    _id: new ObjectId(options.id),
                    author: options.auth.id,
                },
                {
                    $set: {
                        content: options.body.content,
                    },
                },
            );
        },
        async deleteComment(options) {
            await db.collection<CommentType>(CommentCollection).deleteOne({
                _id: new ObjectId(options.id),
                author: options.auth.id,
            });
        },
        async getCommentAuthor(options) {
            const result = await db
                .collection<CommentType>(CommentCollection)
                .findOne({
                    _id: new ObjectId(options.id),
                });
            return result?.author ?? null;
        },
        async getRole(options) {
            const result = await db.collection<RoleType>(RoleCollection).findOne({
                userId: options.auth.id,
            });

            return result ?? null;
        },
    };
}

function createGenericProvider(
    db: Db,
    auth: "better-auth" | "next-auth",
): StorageAuthProvider {
    const idField = auth === "better-auth" ? "_id" : "email";

    return {
        async getUsers(userIds) {
            const result = await db
                .collection("user")
                .find({
                    [idField]: {
                        $in:
                            idField === "_id" ? userIds.map((v) => new ObjectId(v)) : userIds,
                    },
                })
                .toArray();

            return result.map((res) => ({
                id: res[idField].toString(),
                image: res.image,
                name: res.name ?? "Unknown User",
            })) as UserProfile[];
        },
        async queryUsers(options) {
            const result = await db
                .collection("user")
                .find({
                    name: {
                        $regex: options.name,
                    },
                })
                .limit(options.limit)
                .toArray();

            return result.map((res) => ({
                id: res[idField].toString(),
                image: res.image,
                name: res.name ?? "Unknown User",
            })) as UserProfile[];
        },
    };
}
