import { NextAuthOptions } from "next-auth";
import { UpstashRedisAdapter } from "@next-auth/upstash-redis-adapter";
import { db } from "./db";
import GoogleProvider from "next-auth/providers/google"

function getGoogleCredentials(){
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET

    if(!clientId || clientId.length === 0){
        throw new Error("Missing GOOGLE_CLIENT_ID")
    }
    if(!clientSecret || clientSecret.length === 0){
        throw new Error("Missing GOOGLE_CLIENT_SECRET")
    }
    return {
        clientId,clientSecret
    }
}
export const authOptions: NextAuthOptions = {
    adapter: UpstashRedisAdapter(db),
    session:{
        strategy:'jwt'
    },
    pages:{
        signIn:'/login',
        signOut:'/login',
    },
    providers: [
        GoogleProvider({
            clientId: getGoogleCredentials().clientId,
            clientSecret: getGoogleCredentials().clientSecret,
        })
    ],
    callbacks:{
        async jwt({token,user}){
            const dbUser = (await db.get(`user:${token.id}`)) as User | null
            if(!dbUser){
                token.id = user!.id
                return token
            }
            return {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                picture: dbUser.image
            }
        },
        async session({session,token}){
            if(token){
                session.user.id = token.id
                session.user.name = token.name
                session.user.email = token.email
                session.user.image = token.picture
            }

            return session
        },
        async redirect({ url, baseUrl }) {
            // If the URL contains 'signout', redirect to the login page after sign out
            if (url.includes('/signout')) {
                return baseUrl + '/login';
            }

            // For login, redirect to the dashboard
            if (url === baseUrl || url === baseUrl + '/login') {
                return baseUrl + '/dashboard';
            }

            // Default to base URL for any other cases
            return url.startsWith(baseUrl) ? url : baseUrl;
        },
        // async redirect({ url, baseUrl }) {
        //     console.log("url>>>>",url)
        //     console.log("baseUrl>>>>",baseUrl)
        //     if (url === '/signout') {
        //         return baseUrl;  // Redirect to your custom signout page
        //     }
        //     return '/dashboard';
        // },


        // redirect({ url, baseUrl }){
        //     console.log("url>>>>",url)
        //     console.log("baseUrl>>>>",baseUrl)
        //     return '/dashboard'
        // }
    }
}