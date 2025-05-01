import * as react from 'react';
import { HTMLAttributes, ReactNode } from 'react';
import { C as CommentsProviderProps } from './atom-CkT1hPsy.js';
export { M as MentionContextType } from './atom-CkT1hPsy.js';
export { S as StorageContext } from './storage-CRqS87xe.js';
import '@fuma-comment/server';
import '@tiptap/react';

type CommentsProps = Omit<HTMLAttributes<HTMLDivElement>, keyof CommentsProviderProps | keyof InnerProps> & CommentsProviderProps & InnerProps;
interface InnerProps {
    title?: ReactNode;
    /**
     * title to show when the user has not logged in.
     *
     * Fallbacks to default `title` when not specified.
     */
    titleUnauthorized?: ReactNode;
}
declare const Comments: react.ForwardRefExoticComponent<Omit<HTMLAttributes<HTMLDivElement>, keyof CommentsProviderProps | keyof InnerProps> & CommentsProviderProps & InnerProps & react.RefAttributes<HTMLDivElement>>;

export { Comments, type CommentsProps };
