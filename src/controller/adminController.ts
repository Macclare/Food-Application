import express, { Request, Response } from "express";
import { option, GenerateSalt, GeneratePassword, GenerateOTP, GenerateSignature, adminSchema, validatePassword, vendorSchema } from "../utils";
import { UserAttributes, UserInstance } from "../model/userModel";
import { v4 as uuidv4 } from 'uuid'
import { FromAdminMail, userSubject } from "../config";
import { JwtPayload } from "jsonwebtoken";
import { VendorInstance, VendorAttributes } from "../model/vendorModel";

/**============================Register Admin=========================== **/
export const AdminRegister = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.user.id
        const {
            email,
            phone,
            password,
            firstName,
            lastName,
            address
        } = req.body;
        const uuiduser = uuidv4()

        const validateResult = adminSchema.validate(req.body, option);
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }
        // Generate salt
        const salt = await GenerateSalt();
        const adminPassword = await GeneratePassword(password, salt)

        //Generate otp
        const { otp, expiry } = GenerateOTP();

        //Check if the admin exists
        const Admin = await UserInstance.findOne({
            where: {
                id: id
            }
        }) as unknown as UserAttributes;

        if (Admin.email === email) {
            return res.status(400).json({
                Error: "Email already exists"
            })
        }
        if (Admin.phone === phone) {
            return res.status(400).json({
                Error: "Phone number already exists"
            })
        }

        //Create Admin
        if (Admin.role === "superadmin") {
         await UserInstance.create({
                id: uuiduser,
                email,
                phone,
                firstName,
                lastName,
                address,
                password: adminPassword,
                salt,
                otp,
                otp_expiry: expiry,
                lng: 0,
                lat: 0,
                verified: true,
                role: 'admin'
            })
            // check if admin exists
            const Admin = await UserInstance.findOne({
                where: { id:id }
            }) as unknown as UserAttributes
            //Generate Signature
            let signature = await GenerateSignature({
                id: Admin.id,
                email: Admin.email,
                verified: Admin.verified
            })

            return res.status(201).json({
                message: "Admin created successfully",
                signature,
                verifed: Admin.verified
            })
        }
        return res.status(400).json({
            message: "Admin already exists"
        })

    } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/admins/create-admin"
        })
    }
}

/**============================Register SuperAdmin=========================== **/

export const SuperAdminRegister = async (req: JwtPayload, res: Response) => {
    try {
        
        const {
            email,
            phone,
            password,
            firstName,
            lastName,
            address
        } = req.body;
        const uuiduser = uuidv4()

        const validateResult = adminSchema.validate(req.body, option);
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }
        // Generate salt
        const salt = await GenerateSalt();
        const adminPassword = await GeneratePassword(password, salt)

        //Generate otp
        const { otp, expiry } = GenerateOTP();

        //Check if the admin exists
        const Admin = await UserInstance.findOne({
            where: {
                email: email
            }
        }) as unknown as UserAttributes;

        //Create Admin
        if (!Admin) {
         await UserInstance.create({
                id: uuiduser,
                email,
                phone,
                firstName,
                lastName,
                address,
                password: adminPassword,
                salt,
                otp,
                otp_expiry: expiry,
                lng: 0,
                lat: 0,
                verified: true,
                role: 'superadmin'
            })
            // check if admin exists
            const Admin = await UserInstance.findOne({
                where: { email: email}
            }) as unknown as UserAttributes
            //Generate Signature
            let signature = await GenerateSignature({
                id: Admin.id,
                email: Admin.email,
                verified: Admin.verified
            })

            return res.status(201).json({
                message: "Admin created successfully",
                signature,
                verifed: Admin.verified
            })
        }
        return res.status(400).json({
            message: "Admin already exists"
        })

    } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/admins/create-super-admin"
        })
    }
}


/**============================Create Vendor=========================== **/

export const CreateVendor = async (req: JwtPayload, res: Response) => {
    try{
        const id = req.user.id
const  {
    name,
    restaurantName,
    pincode,
    address,
    email,
    password,
    phone,
} = req.body
const uuidvendor = uuidv4()
const validateResult = vendorSchema.validate(req.body, option);
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }
 // Generate salt
 const salt = await GenerateSalt();
 const vendorPassword = await GeneratePassword(password, salt)

 //Check if the vendor exists
 const Vendor = await VendorInstance.findOne({
    where: {
        email: email
    }
}) as unknown as VendorAttributes;

const Admin = await UserInstance.findOne({
    where: {
        id: id
    }
}) as unknown as UserAttributes;

if (Admin.role === "superadmin" || Admin.role === "admin") {
if(!Vendor){    
 const createVendor =   await VendorInstance.create({
        id: uuidvendor,
        email,
        phone,
        name,
        restaurantName,
        address,
        pincode,
        password: vendorPassword,
        salt,
       serviceAvailable: false, 
        role: 'vendor',
        rating: 0,
        coverImage: "",
    })

    return res.status(201).json({
        message: "Vendor created successfully",
        createVendor
    })
}
return res.status(400).json({
    message: "Vendor already exists"
  })
}
return res.status(400).json({
    message: "You are not authorized to create a vendor"
})

    }catch(err){
        res.status(500).json({
            Error: "Internal server Error",
            route: "/admins/create-vendors"
        })
    }
}
