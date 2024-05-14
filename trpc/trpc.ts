import { TRPCError, initTRPC } from '@trpc/server'
import { SignedIn, auth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";

const t = initTRPC.create()
const middleware = t.middleware

const isAuth = middleware(async (opts) => {

  const { userId } = auth();
  
  const user = await getUserById(userId);

  if (!user || !user.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return opts.next({
    ctx: {
      userId: user.id,
      user,
    },
  })
})

export const router = t.router
export const publicProcedure = t.procedure
export const privateProcedure = t.procedure.use(isAuth)
