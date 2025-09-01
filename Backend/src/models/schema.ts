import mongoose, { Document, Schema } from "mongoose";

interface INote {
  _id?: mongoose.Types.ObjectId;
  text: string;
}



export interface IUser extends Document {
  id: string;
  name: string;
  dob: Date;
  email: string;
  notes: INote[];
}

const NoteSchema = new Schema<INote>(
  {
    text: { type: String, required: true, trim: true },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    dob: { type: Date, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    notes: { type: [NoteSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        delete ret.__v;
      },
    },
  }
);

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
