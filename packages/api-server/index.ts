import express from "express";
import * as trpc from "@trpc/server";
import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import { z } from "zod";
import crypto from "crypto";
import fs from "fs";

interface ChatMessage {
  user: string;
  message: string;
  signature? : string;
  publickey? : string;
}

interface User {
  username: string;
  publickey: string;
}

interface AuthorisedUser {
  hashedmessage : string;
  signature : string; 
  publickey : string;
}



type AuthorizedOrUnAuthorized <T extends AuthorisedUser | string> = T extends AuthorisedUser ? AuthorisedUser : string;


const encryption = (message: string, key: string , username: string) => {
 
  

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
    },
    privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'my-passphrase'
    }
});

fs.writeFileSync('public.pem', publicKey);

fs.writeFileSync('private.pem', privateKey);


const hash = crypto.createHash('sha256').update(message).digest('hex');

const signature = crypto.sign('sha256', Buffer.from(hash), {
  key: privateKey,
  passphrase: 'my-passphrase'
});

const data = {
  message,
  signature: signature.toString('base64'),
  publicKey: publicKey
};



return data

}

const decryption = (message: string, key: string) => {
 
}



const messages: ChatMessage[] = [
  { user: "user1", message: "Hello" },
  { user: "user2", message: "Hi" },
];

const appRouter = trpc
  .router()
  .query("hello", {
    resolve() {
      return "Hello world III";
    },
  })
  .query("getMessages", {
    input: z.number().default(10),
    resolve({ input }) {
      return messages.slice(-input);
    },
  })

  
  .mutation("addMessage", {
    input: z.object({
      user: z.string(),
      message: z.string(),
    }),
    resolve({ input }) {
      const data = encryption(input.message, input.user , input.user);
       
    
    },
  })


export type AppRouter = typeof appRouter;

const app = express();
app.use(cors());
const port = 8080;

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: () => null,
  })
);

app.get("/", (req, res) => {
  res.send("Hello from api-server");
});

app.listen(port, () => {
  console.log(`api-server listening at http://localhost:${port}`);
});
