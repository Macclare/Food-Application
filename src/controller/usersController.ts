import express, { Request, Response } from "express";
import { registerSchema, option, GenerateSalt, GeneratePassword, GenerateOTP, onRequestOTP, emailHtml, mailSent, GenerateSignature, verifySignature, loginSchema, validatePassword, updateSchema } from "../utils";
import { UserAttributes, UserInstance } from "../model/userModel";
import { v4 as uuidv4 } from 'uuid'
import { FromAdminMail, userSubject } from "../config";
import { JwtPayload } from "jsonwebtoken";
import { RoleContext } from "twilio/lib/rest/conversations/v1/role";
import { WorkspaceRealTimeStatisticsContext } from "twilio/lib/rest/taskrouter/v1/workspace/workspaceRealTimeStatistics";
import { string } from "joi";


/**==================Register==================== **/
export const Register = async (req: Request, res: Response) => {
    try {
        const {
            email,
            phone,
            password,
            confirm_password
        } = req.body;
        const uuiduser = uuidv4()

        const validateResult = registerSchema.validate(req.body, option);
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }
        // Generate salt
        const salt = await GenerateSalt();
        const userPassword = await GeneratePassword(password, salt)

        //Generate otp
        const { otp, expiry } = GenerateOTP();

        //Check if the user exists
        const User = await UserInstance.findOne({
            where: {
                email: email
            }
        })

        //Create User
        if (!User) {
            let user = await UserInstance.create({
                id: uuiduser,
                email,
                phone,
                firstName: '',
                lastName: '',
                address: '',
                password: userPassword,
                salt,
                otp,
                otp_expiry: expiry,
                lng: 0,
                lat: 0,
                verified: false,
                role: 'user'
            })

            //Send OTP to user
            // await onRequestOTP(otp, phone)

            //send Email
            const html = emailHtml(otp)
            await mailSent(FromAdminMail, email, userSubject, html)

            // check if user exists
            const User = await UserInstance.findOne({
                where: { email: email }
            }) as unknown as UserAttributes
            //Generate Signature
            let signature = await GenerateSignature({
                id: User.id,
                email: User.email,
                verified: User.verified
            })


            return res.status(201).json({
                message: "User created successfully, check your email or phone number for OTP verification",
                signature,
                verifed: User.verified
            })
        }
        return res.status(400).json({
            message: "User already exists"
        })


    } catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/signup"
        })
    }
}

/**==================Verify Users==================== **/

export const VerifyUser = async (req: Request, res: Response) => {
    try {
        const token = req.params.signature
        const decode = await verifySignature(token)

        // check if user is a registered user
        const User = await UserInstance.findOne({
            where: { email: decode.email }
        }) as unknown as UserAttributes

        if (User) {
            const { otp } = req.body
            //check if the otp submitted by the user is correct and is same with the one in the database
            if (User.otp === parseInt(otp) && User.otp_expiry >= new Date()) {
                //update user
                const updatedUser = await UserInstance.update({ verified: true },
                    { where: { email: decode.email } }) as unknown as UserAttributes

                // Generate a new Signature
                let signature = await GenerateSignature({
                    id: updatedUser.id,
                    email: updatedUser.email,
                    verified: updatedUser.verified
                });

                if (updatedUser) {
                    const User = (await UserInstance.findOne({
                        where: { email: decode.email },
                    })) as unknown as UserAttributes
                    return res.status(200).json({
                        message: "Your account have been verified successfully",
                        signature,
                        verified: User.verified
                    })
                }
            }
        }
        return res.status(400).json({
            Error: 'invalid credentials or OTP already expired'
        })
    }
    catch (err) {
        res.status(500).json({
            Error: "Internal server Error",
            route: "/users/verify"
        })
    }
}

/**==================Login User==================== **/

export const Login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const validateResult = loginSchema.validate(req.body, option);
        if (validateResult.error) {
            return res.status(400).json({
                Error: validateResult.error.details[0].message
            })
        }
        // check if user exists
        const User = await UserInstance.findOne({
            where: { email: email }
        }) as unknown as UserAttributes;
        
        if (User.verified === true) {
         const validation = await validatePassword(password, User.password, User.salt)
            if(validation){
                // Generate a new Signature
                let signature = await GenerateSignature({
                    id: User.id,
                    email: User.email,
                    verified: User.verified
                });
                return res.status(200).json({
                    message: "Login successful",
                    signature,
                    email: User.email,
                    verified: User.verified,
                    role: User.role
                })
            }
        }
        return res.status(400).json({
            Error: "Wrong Username or password or not a verified user"
        })
    } catch (err) {
      return res.status(500).json({
            Error: "Internal server Error",
            route: "/users/login"
        })
    }
}

/**============================Resend OTP=========================== **/

export const ResendOTP = async (req: Request, res: Response) => {
 try{
   const token = req.params.signature;
    const decode = await verifySignature(token);

    // check if user is a registered user
    const User = await UserInstance.findOne({
        where: { email: decode.email }
    }) as unknown as UserAttributes;

    if (User) {
        //Generate otp
        const { otp, expiry } = GenerateOTP();
        //update user
        const updatedUser = await UserInstance.update({ otp, otp_expiry: expiry },
            { where: { email: decode.email } }) as unknown as UserAttributes;

        if (updatedUser) {
            //Send OTP to user
            // await onRequestOTP(otp, User.phone);

            //send Email
            const html = emailHtml(otp);
            await mailSent(FromAdminMail, User.email, userSubject, html);

            return res.status(200).json({
                message: "OTP resent successfully, kindly check your eamil or phone number for OTP verification"
            })
        }
    }
    return res.status(400).json({
        Error: 'Error sending OTP'
    })
 }catch(err){
   return res.status(500).json({
        Error: "Internal server Error",
        route: "/users/resend-otp/:signature"
    })
 }
}

/**============================Profile=========================== **/

export const getAllUsers = async (req:Request, res: Response) => {
    try {
        const limit = req.query.limit as number | undefined;
        const users = await UserInstance.findAndCountAll({limit:limit})
        if (users) {
            return res.status(200).json({
                message: 'You have successfully retrieved all users',
                Count: users.count,
                Users: users.rows
            })
        }
    } catch (err) {
       return res.status(500).json({
            Error: "Internal server Error",
            route: "/users/get-all-users"
        })
    }
}

export const getSingleUser = async (req: JwtPayload, res: Response) => {
    try {
        const id = req.user.id;
        // find user by id
        const User = await UserInstance.findOne({
            where: {id:id} 
        }) as unknown as UserAttributes;
        if (User){
   return res.status(200).json({
        User
    })
      }
      return res.status(400).json({
        message: 'User not found'
      })
    } catch (err) {
       return res.status(500).json({
            Error: "Internal server Error",
            route: "/users/get-user"
        })
    }
}

export const updateUserProfile = async (req: JwtPayload, res: Response) => {
    try{
const id = req.user.id;
 const { firstName,lastName, address, phone} = req.body;
    const validateResult = updateSchema.validate(req.body, option);
    if (validateResult.error) {
        return res.status(400).json({
            Error: validateResult.error.details[0].message
        })
    }
    // find user by id
    const User = await UserInstance.findOne({
        where: {id:id}
    }) as unknown as UserAttributes;
    if (!User) {
        return res.status(400).json({
            Error: 'You are not authorized to update this profile'
        })
    }
const updatedUser = await UserInstance.update({ firstName, lastName, address, phone },
        { where: { id: id } }) as unknown as UserAttributes;
    if (updatedUser) {
     const User = await UserInstance.findOne({
            where: {id:id}
     }) as unknown as UserAttributes;
        return res.status(200).json({
            message: 'Profile updated successfully',
            User
        })
    }
    return res.status(400).json({
        Error: 'Error updating profile'
    })

    }catch(err){
       return res.status(500).json({
            Error: "Internal server Error",
            route: "/users/update-profile"
        })
    }
}