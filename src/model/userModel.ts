import { DataTypes, Model } from "sequelize";
import {db} from "../config"

export interface UserAttributes {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    salt: string;
    address: string;
    phone: string;
    otp: number;
    otp_expiry: Date;
    lng: number;
    lat: number;
    verified: boolean;
    role: string;
    
}

export class UserInstance extends Model <UserAttributes>{}

UserInstance.init({
id:{
    type: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
},
 email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
        notNull:{
            msg: "Email address is required"
        },
        isEmail: {
            msg: "please provide a valid email"
        }
    }
 },
 password: {
   type: DataTypes.STRING,
   allowNull: false,
   validate: {
    notNull : {
        msg: "Password is required"
    },
    notEmpty: {
        msg: "provide a password"
    }
   }
 },
 firstName: {
    type: DataTypes.STRING,
    allowNull: true,
 },
 lastName: {
    type: DataTypes.STRING,
    allowNull: true,
 },
 salt : {
    type: DataTypes.STRING,
    allowNull: false
 },
 address: {
    type: DataTypes.STRING,
    allowNull: true
 },
 phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
        notNull: {
            msg: "Phone number is required "
        },
        notEmpty: {
         msg: "provide a phone number"
        }
    }
 },
 otp: {
    type: DataTypes.NUMBER,
    allowNull: false,
    validate: {
        notNull: {
            msg: "otp is required "
        },
        notEmpty: {
         msg: "provide an otp"
        }
    }
 },
 otp_expiry: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
        notNull: {
            msg: "otp expired "
        }
    }
 },
 lng: {
    type: DataTypes.NUMBER,
    allowNull: true
 },
 lat: {
    type: DataTypes.NUMBER,
    allowNull: true
 },
 verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    validate: {
        notNull: {
            msg: "User must be verified"
        },
        notEmpty: {
         msg: "User not verified"
        }
    }
 },
 role: {
    type: DataTypes.STRING,
    allowNull: true
 }
 },

 {
    sequelize:db,
    tableName: "user"
 });
