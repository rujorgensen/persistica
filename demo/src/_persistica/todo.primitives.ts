export type Priority = 'NORMAL' | 'HIGH';

export interface ITodo {
    id: number; // @id;
    description: string;
    isCompleted: boolean;
    priority: Priority;
    updatedAt?: Date;
    createdAt: Date;
};