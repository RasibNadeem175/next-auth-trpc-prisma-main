import {t} from '../../trpc'
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { any, number, string } from "zod";

export const bookRouterUser = t.router({
  
  addRating: t.procedure //
  .input(z.object({
    book_url: string(),
    rating: number().min(0).max(5)
   }))
  .query(async ({input, ctx}) => { //TODO: should be a mutation
    const { book_url, rating } = input
    const Book = await ctx.prisma.book.findFirst({     // check if the book exist in library 
        where: {
            book_url: book_url,
        }
    })
    if(!ctx.session?.user.userId){
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found. Can't rate",
      });
    }
    
    if(rating > 5) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Bad rating",
      });
    }

    if(!Book) {     // else throw error
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Book not found. Can't rate",
          });
    }
    try{
      const result = await ctx.prisma.userJoinBook.update({
        where: {
          userId_bookId: {
              userId: Number(ctx.session?.user.userId),
              bookId: Book.id
          }
        },
        data: {
          Rating: rating
        }
      })
  
    } catch (error) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Can't add rating before adding to library",
      });
    }

    return {
        status: 201,
        message: "update successful successful",
    }
  }),
  
  
  addToLibrary: t.procedure //
  .input(z.object({
    book_url: string()
   }
  ))
  .mutation(async ({input, ctx}) => { 
    const { book_url} = input

    if(!ctx.session?.user.email) {
      throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
    }
  
    const Book = await ctx.prisma.book.findFirst({
        where: {
            book_url: book_url
        }
    })

    if(!Book) {
      throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book not found",
        });
  }

  const alreadyExist = await ctx.prisma.userJoinBook.findFirst({
    where: {
      userId: Number(ctx.session.user.userId),
      book: Book
    }
  })

  if(alreadyExist) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "User's library already has this book",
    });
  }
    const result = await ctx.prisma.userJoinBook.create({
      data: {
        user: {
          connect: {
            email: ctx.session.user.email
          }
        },
        book: {
          connect: {
            book_url: book_url
          }
        },
        Rating: 5,
      }
    })
    
    return {
        message: "created entry in UserJoinBook table",
        result: result,
    }
  }),


  fetchFromLibrary: t.procedure //return the user id and book id
  .input(z.object({
    book_url: string(),
    data: any()
   }
  ))
  .query(async ({input, ctx}) => { 
    const { book_url} = input
    if(!ctx.session?.user.email) {
      throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
    }
  
    const Book = await ctx.prisma.book.findFirst({ //this query is to find the id for book
        where: {
            book_url: book_url
        },
        select: {
          id: true,
          book_url: true
        }
    })

    if(!Book) {
      throw new TRPCError({
          code: "NOT_FOUND",
          message: "Book not found",
        });
  }

  const result = await ctx.prisma.userJoinBook.findFirst({
    where: {
      userId: Number(ctx.session.user.userId),
      bookId: Book.id
    },
  })

  if(result) {
    return {
      message: "entry exists in UserJoinBook table",
      exists: true,
      result: result,
    }
  }
    return {
      message: "entry doesn't exists in UserJoinBook table",
      exists: false,
      result: result,
    }
  }),

  AllBookInLibrarySortedRecent: t.procedure //TODO: add a keyword search
  .input(z.object({
   //dbook_url: string(),
   data: any()
   }))
  .query(async ({input, ctx}) => { 
    const {} = input
    if(!ctx.session?.user.email) {
      throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
    }

  const booksInLibrary = await ctx.prisma.userJoinBook.findMany({
    where: {
      userId: Number(ctx.session.user.userId),
    },
    select: {
        bookId: true,
        Rating: true,
        book:{ 
          select: {
            image_url: true,
            book_url: true,
            name: true
          },
        }
    }
  })

    return {
      message: "Listed all books in user library in recently added",
      result: booksInLibrary,
    }
  }),

  removeFromLibrary: t.procedure //
  .input(z.object({
    book_url: string()
   }
  ))
  .mutation(async ({input, ctx}) => { //should be a  mutation
    const { book_url} = input

    if(!ctx.session?.user.email) {
      throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
    }
  
    const Book = await ctx.prisma.book.findFirst({
        where: {
            book_url: book_url
        },
        select: {
          id: true,
          book_url: true
        }
    })

    if(!Book) {
      throw new TRPCError({
          code: "NOT_FOUND",
          message: `Book not found at the url ${book_url}`,
        });
  }

  try{
    const result = await ctx.prisma.userJoinBook.delete({
      where: {
        userId_bookId: {
          userId: Number(ctx.session.user.userId),
          bookId: Book.id
        }
      },
    })
  } catch {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `User's library doesn't have ${book_url}`,
    });
  }
  }),
});