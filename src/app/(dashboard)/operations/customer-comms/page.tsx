import { redirect } from "next/navigation"

/** Old path; Administrative Operations links to Reviews at `/feedback`. */
export default function OperationsCustomerCommsRedirectPage() {
  redirect("/feedback")
}
