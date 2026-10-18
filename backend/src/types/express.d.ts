import { Document } from "mongoose";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: any;
        email: string;
        role: "admin" | "staff" | "buyer";
        status: "pending" | "approved" | "blacklisted";
        lastLogin?: Date;
        createdAt: Date;
        updatedAt: Date;
        del_flg: boolean;
      } & Document;
    }
  }
}

export interface RequestUser extends Request {
  user?: {
    _id: any;
    email: string;
    role: "admin" | "staff" | "buyer";
    status: "pending" | "approved" | "blacklisted";
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    del_flg: boolean;
  } & Document;
}
