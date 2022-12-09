import express, { Request, Response, NextFunction} from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

import { APP_SECRET } from "../config";
import { UserAttributes, UserInstance } from "../model/userModel";
import { VendorInstance, VendorAttributes } from "../model/vendorModel";

export const auth = async (req: JwtPayload, res: Response, next:NextFunction) => {
  try {
    const authorization = req.headers.authorization;

    if(!authorization){
      return res.status(401).json({
        Error: "Kindly login"
      })
    }
    //Bearer token
    const token = authorization.slice(7, authorization.length);
  let verified = jwt.verify(token, APP_SECRET );
    if(!verified){
        return res.status(401).json({
            Error: "Unauthorized access"
        })
    }
 const {id} = verified as {[Key:string]: string};

 // find user by Id
 const user = await UserInstance.findOne({
    where: {id:id} 
}) as unknown as UserAttributes;
if(!user){
    return res.status(401).json({
        Error: "Unauthorized access"
    })
}
req.user = verified;
next()

  } catch (err) {
    res.status(401).json({ msg: "Unauthorized" });
  }
}

export const authVendor = async (req: JwtPayload, res: Response, next:NextFunction) => {
    try {
      const authorization = req.headers.authorization;
  
      if(!authorization){
        return res.status(401).json({
          Error: "Kindly login"
        })
      }
      //Bearer token
      const token = authorization.slice(7, authorization.length);
    let verified = jwt.verify(token, APP_SECRET );
      if(!verified){
          return res.status(401).json({
              Error: "Unauthorized access"
          })
      }
   const {id} = verified as {[Key:string]: string};
  
   // find vendor by Id
   const vendor = await VendorInstance.findOne({
      where: {id:id} 
  }) as unknown as VendorAttributes;
  if(!vendor){
      return res.status(401).json({
          Error: "Unauthorized access"
      })
  }
  req.vendor = verified;
  next()
  
    } catch (err) {
      res.status(401).json({ msg: "Unauthorized" });
    }
  }