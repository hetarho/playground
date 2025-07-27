import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="w-full h-screen flex flex-col">
      <div className="p-2 flex gap-2 h-10 bg-black text-white">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>{" "}
        <Link to="/about" className="[&.active]:font-bold">
          About
        </Link>{" "}
        <Link to="/canvas" className="[&.active]:font-bold">
          Canvas
        </Link>
        <Link to="/three" className="[&.active]:font-bold">
          Three
        </Link>
        <Link to="/metaball" className="[&.active]:font-bold">
          Metaball
        </Link>
        <Link
          to="/gilt-bronze-incense-burner"
          className="[&.active]:font-bold [&.active]:text-yellow-500"
        >
          Gilt Bronze Incense Burner
        </Link>
      </div>
      <div className="w-full flex-1 bg-black">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </div>
  ),
});
