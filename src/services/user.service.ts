import { Request } from "express";
import { User } from "../entities/User";
import { userRepository } from "../repositories";
import * as dotenv from "dotenv";
import { sign } from "jsonwebtoken";
import { AssertsShape } from "yup/lib/object";
import { serializedCreateUserSchema } from "../schemas";
import { ErrorHandler } from "../errors";

dotenv.config();

interface ILogin {
  status: number;
  message: object;
}

class UserService {
  loginUser = async ({ validated }: Request): Promise<ILogin> => {
    const user: User = await userRepository.findOne({
      email: validated.email,
    });

    if (!user || !(await user.comparePwd(validated.password))) {
      throw new ErrorHandler(401, {
        error: {
          message: "Invalid credentials",
        },
      });
    }

    /* if (!(await user.comparePwd(validated.password))) {
      return {
        status: 401,
        message: { message: "Invalid credentials" },
      };
    } */

    const token: string = sign({ id: user.id }, process.env.SECRET_KEY, {
      expiresIn: process.env.EXPIRES_IN,
    });

    return {
      status: 200,
      message: { token },
    };
  };

  createUser = async ({
    validated,
    userAuth,
  }: Request): Promise<AssertsShape<any>> => {
    if (validated.isAdm && !userAuth.isAdm) {
      throw new ErrorHandler(401, {
        error: {
          name: "JsonWebTokenError",
          message: "jwt malformed",
        },
      });
    }

    const user: User = await userRepository.save(validated);

    return await serializedCreateUserSchema.validate(user, {
      stripUnknown: true,
    });
  };
}

export default new UserService();
