import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { getUserProfile } from "@/lib/auth"
import { getTicketDetails, addTicketComment, addTicketSolution, updateTicketStatus, assignTicket } from "@/lib/tickets"
import { redirect } from "next/navigation"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wrench, CheckCircle, XCircle, UserPlus, MessageSquare } from "lucide-react"


export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const userProfile = await getUserProfile();
  const supabase = await getSupabaseServerClient();

  if (!userProfile) {
    redirect("/login");
  }

  const ticket = await getTicketDetails(params.id);

  if (!ticket) {
    return (
      <div className="text-destructive text-center py-10">
        Ticket not found or you do not have permission to view it.
      </div>
    );
  }

  const isClient = userProfile.role === "client" && userProfile.id === ticket.user_id;
  const isTechnician = userProfile.role === "technician";
  const isAdmin = userProfile.role === "admin";
  const canManage = isTechnician || isAdmin;

  // Fetch technicians robustly
  let technicians: { id: string; full_name: string | null; username: string | null }[] = [];
  let techError: any = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .eq("role", "technician");
    if (error) techError = error;
    if (data) technicians = data;
  } catch (err) {
    techError = err;
  }

  if (techError) {
    console.error("Error fetching technicians for assignment:", techError);
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            {ticket.title}
            <TicketStatusBadge status={ticket.status} />
          </CardTitle>
          <CardDescription>
            Submitted by {(() => {
              const p = ticket.profiles as { full_name?: string | null; username?: string | null } | null | undefined;
              if (p && (p.full_name || p.username)) {
                // Sanitize output to prevent XSS
                const safeName = (p.full_name ?? p.username ?? "Unknown").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                return safeName;
              }
              return "Unknown";
            })()} on {format(new Date(ticket.created_at), "PPP")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div>
            <h3 className="font-semibold text-lg mb-2">Description</h3>
            <p className="text-muted-foreground">{ticket.description}</p>
          </div>
          {ticket.category && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Category</h3>
              <p className="text-muted-foreground">{ticket.category}</p>
            </div>
          )}
          {ticket.assigned_to && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Assigned To</h3>
              <p className="text-muted-foreground">
                {ticket.assigned_technician?.full_name || ticket.assigned_technician?.username || "Unassigned"}
              </p>
            </div>
          )}
          {ticket.attachment_url && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Attachment</h3>
              <a
                href={ticket.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                aria-label="View ticket attachment in a new tab"
              >
                View Attachment
              </a>
            </div>
          )}

          {/* Technician/Admin Actions */}
          {canManage && (
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-lg mb-4">Actions</h3>
              <div className="flex flex-wrap gap-3">
                {ticket.status !== "Closed" && (
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await updateTicketStatus(undefined, formData);
                    }}
                    method="POST"
                  >
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <input type="hidden" name="newStatus" value={ticket.status === "Pending" ? "In Progress" : "Resolved"} />
                    <Button type="submit" size="sm" variant={ticket.status === "Pending" ? "default" : "secondary"}>
                      {ticket.status === "Pending" ? (
                        <Wrench className="h-4 w-4 mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {ticket.status === "Pending" ? "Start Progress" : "Mark Resolved"}
                    </Button>
                  </form>
                )}
                {ticket.status === "Resolved" && (
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await updateTicketStatus(undefined, formData);
                    }}
                    method="POST"
                  >
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <input type="hidden" name="newStatus" value="Closed" />
                    <Button type="submit" size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" /> Close Ticket
                    </Button>
                  </form>
                )}
                {isAdmin && (
                  <form
                    action={async (formData: FormData) => {
                      "use server";
                      await assignTicket(undefined, formData);
                    }}
                    method="POST"
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="ticketId" value={ticket.id} />
                    <Select name="technicianId" defaultValue={ticket.assigned_to || undefined}>
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Assign Technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {technicians?.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {(tech.full_name ?? tech.username) || "Unknown"}
                          </SelectItem>
                        ))}
                        <SelectItem value="unassign">Unassign</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="submit" size="sm">
                      <UserPlus className="h-4 w-4 mr-2" /> Assign
                    </Button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Solution */}
          {ticket.solution && (
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-lg mb-2">Solution</h3>
              <p className="text-muted-foreground">{ticket.solution}</p>
            </div>
          )}
          {canManage && ticket.status === "Resolved" && !ticket.solution && (
            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-lg mb-2">Add Solution</h3>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await addTicketSolution(ticket.id, formData);
                }}
                className="grid gap-2"
              >
                <Label htmlFor="solution">Solution Details</Label>
                <Textarea
                  id="solution"
                  name="solution"
                  placeholder="Describe the solution provided."
                  rows={4}
                  required
                />
                <Button type="submit" className="self-end">
                  Add Solution
                </Button>
              </form>
            </div>
          )}

          {/* Comments Section */}
          <div className="border-t pt-6 mt-6">
            <h3 className="font-semibold text-lg mb-4">Comments</h3>
            <div aria-live="polite">
              {ticket.comments && (ticket.comments as any[]).length > 0 ? (
                <div className="space-y-4">
                  {(ticket.comments as any[]).map((comment, index) => (
                    <div key={index} className="bg-muted p-3 rounded-md">
                      <p className="text-sm font-medium">
                        {comment.user_id === userProfile.id ? "You" : `User ${comment.user_id.substring(0, 8)}...`} on{" "}
                        {format(new Date(comment.created_at), "PPP p")}
                      </p>
                      <p className="text-muted-foreground mt-1">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No comments yet.</p>
              )}
            </div>

            {/* TODO: Surface form errors with role='alert' if needed */}
            <form
              action={async (formData: FormData) => {
                "use server";
                await addTicketComment(ticket.id, formData);
              }}
              className="mt-6 grid gap-2"
            >
              <Label htmlFor="new-comment">Add a Comment</Label>
              <Textarea id="new-comment" name="comment" placeholder="Type your comment here..." rows={3} required />
              <Button type="submit" className="self-end">
                <MessageSquare className="h-4 w-4 mr-2" /> Add Comment
              </Button>
            </form>
          </div>
        </CardContent>
        <CardFooter>{/* Any other footer actions */}</CardFooter>
      </Card>
    </div>
  )
}
