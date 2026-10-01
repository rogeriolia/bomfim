import { NavLink } from "react-router";
import { filterMainNav } from "@/app/permissions";
import type { UserRole } from "@/app/store";

export function MainNavigation({ role }: { role: UserRole }) {
    return (
        <>
            {filterMainNav(role).map(([label, path]) => (
                <NavLink key={path} to={path}>
                    {label}
                </NavLink>
            ))}
        </>
    );
}
