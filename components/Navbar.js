import Link from "next/link";
import { logout } from "../utils/auth";

const Navbar = ({ token }) => (
  <nav>
    <ul>
      <li>
        <Link href="/">
          <a>Home</a>
        </Link>
      </li>
      <li>
        {!token && (
          <Link href="/login">
            <a>Login</a>
          </Link>
        )}
      </li>
      <li>
        {token && (
          <Link href="/profile">
            <a>Profile</a>
          </Link>
        )}
      </li>
      <li>{token && <button onClick={logout}>Logout</button>}</li>
    </ul>
  </nav>
);

export default Navbar;
