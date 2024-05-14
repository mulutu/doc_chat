import { Document, Schema, model, models } from "mongoose";
import User from "./user.model";
import Message from "./message.model";
import { number } from "zod";

enum UploadStatus {
    PENDING,
    PROCESSING,
    FAILED,
    SUCCESS,
}

export interface File extends Document {
    id: number;
    name: string;
    uploadStatus: UploadStatus;
    url: String;
    key: String;
    messages: typeof Message[];
    createdAt: Date;
    updatedAt: Date;
    User: typeof User;
    userId: String;
}


const FileSchema = new Schema({
    //id: { type:  number, required: true, unique: true},
    name: { type: String, required: true },
    uploadStatus: { type: UploadStatus, required: true, default: UploadStatus.PENDING },
    url: { type: String, required: true },
    key: { type: String, required: true },
    messages: { 
        type: Schema.Types.ObjectId,
        ref: 'Message',
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    User: { type: Schema.Types.ObjectId, ref: 'User' },
    userId: { type: String, required: true }
});

const File = models?.File || model('File', FileSchema);

export default File;