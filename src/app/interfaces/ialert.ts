export interface IAlert {
    message: string
    type: AlertType,
}

export enum AlertType {
    Error
}