export interface Todo {
    id: @id;
    title: string;
    description?: string;
    isCompleted: Boolean;
    priority: Priority;
    createdAt: Date;
    updatedAt: Date;
};