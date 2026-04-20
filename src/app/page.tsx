import { redirect } from "next/navigation"

// Home page that redirects to the login page
export default function Home() {
  redirect("/login")
}
