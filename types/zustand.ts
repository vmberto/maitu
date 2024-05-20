export type GetAction<S> = () => S;

export type SetAction<S> = (newState: Partial<S>) => void;
