import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Search, Download, MessageSquare, Users, UserX } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SpeechRow {
  id: string;
  email: string;
  speech_type: string;
  paid: boolean;
  created_at: string;
  attempts: number;
}

interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

interface LeadRow {
  id: string;
  email: string;
  speech_type: string;
  last_question_reached: number;
  converted: boolean;
  partial_answers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

const Admin = () => {
  const [speeches, setSpeeches] = useState<SpeechRow[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const ADMIN_PIN = "artful2025";

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("get-admin-speeches");
    if (!error && data) {
      if (data.speeches) setSpeeches(data.speeches);
      if (data.contacts) setContacts(data.contacts);
      if (data.leads) setLeads(data.leads);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authorized) fetchData();
  }, [authorized]);

  const filteredSpeeches = speeches.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.speech_type.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.message.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLeads = leads.filter(
    (l) =>
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.speech_type.toLowerCase().includes(search.toLowerCase())
  );

  const partialLeads = filteredLeads.filter((l) => !l.converted);

  const uniqueEmails = new Set(filteredSpeeches.map((s) => s.email)).size;
  const paidCount = filteredSpeeches.filter((s) => s.paid).length;

  const exportCSV = () => {
    const header = "Email,Speech Type,Paid,Date\n";
    const rows = filteredSpeeches
      .map((s) => `${s.email},${s.speech_type},${s.paid},${new Date(s.created_at).toLocaleDateString()}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "speech-leads.csv";
    a.click();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && pin === ADMIN_PIN && setAuthorized(true)}
            />
            <Button className="w-full" onClick={() => pin === ADMIN_PIN && setAuthorized(true)}>
              Enter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="leads">
          <TabsList>
            <TabsTrigger value="leads" className="gap-2">
              <UserX className="h-4 w-4" /> Partial Completers
              {partialLeads.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{partialLeads.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="speeches" className="gap-2">
              <Users className="h-4 w-4" /> Speech Leads
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Contact Forms
              {contacts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{contacts.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
            </div>
          </div>

          {/* Partial Completers Tab */}
          <TabsContent value="leads" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-foreground">{partialLeads.length}</p>
                  <p className="text-sm text-muted-foreground">Abandoned</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-foreground">{filteredLeads.filter((l) => l.converted).length}</p>
                  <p className="text-sm text-muted-foreground">Converted</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {filteredLeads.length > 0
                      ? Math.round((filteredLeads.filter((l) => l.converted).length / filteredLeads.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <p className="p-6 text-center text-muted-foreground">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Speech Type</TableHead>
                        <TableHead>Questions Reached</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partialLeads.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.email}</TableCell>
                          <TableCell className="capitalize">{l.speech_type.replace(/-/g, " ")}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{l.last_question_reached}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={l.converted ? "default" : "secondary"}>
                              {l.converted ? "Converted" : "Abandoned"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {timeAgo(l.updated_at)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {partialLeads.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No partial completers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Speech Leads Tab */}
          <TabsContent value="speeches" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-foreground">{filteredSpeeches.length}</p>
                  <p className="text-sm text-muted-foreground">Total Speeches</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-foreground">{uniqueEmails}</p>
                  <p className="text-sm text-muted-foreground">Unique Users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-bold text-primary">{paidCount}</p>
                  <p className="text-sm text-muted-foreground">Paid</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <p className="p-6 text-center text-muted-foreground">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Speech Type</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Activity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSpeeches.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.email}</TableCell>
                          <TableCell className="capitalize">{s.speech_type.replace(/-/g, " ")}</TableCell>
                          <TableCell>{s.attempts}</TableCell>
                          <TableCell>
                            <Badge variant={s.paid ? "default" : "secondary"}>
                              {s.paid ? "Paid" : "Unpaid"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredSpeeches.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No results found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Forms Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <p className="p-6 text-center text-muted-foreground">Loading...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="w-[40%]">Message</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContacts.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.email}</TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                            {c.message}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(c.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredContacts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No contact submissions yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
