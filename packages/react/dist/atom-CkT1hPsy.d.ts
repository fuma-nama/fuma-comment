import * as react from 'react';
import { ReactNode, ComponentProps, HTMLAttributes, ButtonHTMLAttributes } from 'react';
import { S as StorageContext } from './storage-CRqS87xe.js';
import { SerializedComment } from '@fuma-comment/server';
import { JSONContent } from '@tiptap/react';

interface Session {
    id: string;
    permissions?: Partial<{
        delete: boolean;
    }>;
}
type AuthOptions = {
    type: "api";
    signIn: ReactNode | (() => void);
} | {
    type: "ssr";
    session: Session | null;
    signIn: ReactNode | (() => void);
};

interface MentionItem {
    id: string;
    label: string;
}

type MentionOptions = Partial<Pick<MentionContextType, "query">> & Omit<MentionContextType, "query">;
interface MentionContextType {
    enabled: boolean;
    /**
     * Auto-complete queries.
     *
     * When not specified, fetch from API endpoints.
     */
    query: (text: string, options: {
        page: string;
    }) => MentionItem[] | Promise<MentionItem[]>;
}

declare function Comment({ comment: cached, actions, children, ...props }: ComponentProps<"div"> & {
    comment: SerializedComment;
    actions?: ReactNode;
}): React.ReactElement;

declare function ContentRenderer({ content, }: {
    content: JSONContent;
}): ReactNode;

interface CommentsProviderProps {
    /**
     * Comments will be grouped by `page`
     */
    page: string;
    auth: AuthOptions;
    mention?: MentionOptions;
    storage?: StorageContext;
    /**
     * The URL of the API endpoint.
     *
     * If not specified, the API will be fetched from `/api/comments`.
     */
    apiUrl?: string;
    children?: ReactNode;
}
declare function CommentsProvider({ page, children, mention, storage, auth, apiUrl, }: CommentsProviderProps): React.ReactNode;
declare const CommentsPost: react.ForwardRefExoticComponent<react.FormHTMLAttributes<HTMLFormElement> & react.RefAttributes<HTMLFormElement>>;
declare const CommentsList: react.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement> & react.RefAttributes<HTMLDivElement>>;
declare function AuthButton(props: ButtonHTMLAttributes<HTMLButtonElement>): React.ReactNode;

export { AuthButton as A, type CommentsProviderProps as C, type MentionContextType as M, CommentsProvider as a, CommentsPost as b, CommentsList as c, Comment as d, ContentRenderer as e };
