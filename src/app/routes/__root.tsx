import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="w-full h-screen flex flex-col">
      <div className="p-2 flex gap-2 h-10">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>{" "}
        <Link to="/canvas" className="[&.active]:font-bold">
          Canvas
        </Link>
        <Link to="/wave" className="[&.active]:font-bold">
          Wave
        </Link>
      </div>
      <div className="w-full flex-1 bg-black">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </div>
  ),
});
