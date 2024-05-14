import { Document, Schema, model, models } from "mongoose";

const MessageSchema = new Schema({

    text: {
        type: String,
        required: true,
    },
    isUserMessage: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    User: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    userId: {
        type: String,
        required: true
    },
    File: {
        type: Schema.Types.ObjectId,
        ref: 'File'
    },
    fileId: {
        type: String,
        required: true
    }
});

const Message = models?.Message || model('Message', MessageSchema);

export default Message;