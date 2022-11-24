import type { NextPage } from "next";
import Link from "next/link";

// The page that you will see if didn't login 
const Unauthorized: NextPage = () => {

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content">
        <div className="max-w-lg">
          <h1 className="text-5xl text-center font-bold leading-snug text-gray-400">
            You are not logged in!
          </h1>
          <div className="text-center">
            <Link href="/"> LOG IN </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
