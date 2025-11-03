"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import MainEmptyImage from "../images/main-quick-publish-report-empty.svg";
import { FileText, AlertCircle, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface QuickReport {
  reportId: number;
  reportDate: string;
  actionsLogged: number;
  reportDue: string;
  status: string;
  published: boolean;
  isOverdue: boolean;
}

interface QuickPublishData {
  reports: QuickReport[];
  totalReports: number;
}

export function MainQuickPublishReportCard() {
  const [data, setData] = useState<QuickPublishData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuickPublishReports();
  }, []);

  const fetchQuickPublishReports = async () => {
    try {
      const response = await fetch(
        "/api/dashboard/personal/quick-publish-reports",
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch quick publish reports",
        );
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error("Error fetching quick publish reports:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <FileText className="h-5 w-5 mr-2" /> Quick Publish Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <FileText className="h-5 w-5 mr-2" /> Quick Publish Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.reports.length === 0) {
    return (
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <FileText className="h-5 w-5 mr-2" /> Quick Publish Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center my-8">
            <div className="space-y-4">
              <div>
                <Image
                  src={MainEmptyImage}
                  alt={"Empty Image"}
                  height={300}
                  width={300}
                />
              </div>
              <div className="text-muted-foreground text-sm text-center">
                Reports come alive as you start achieving.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pb-3">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <FileText className="h-5 w-5 mr-2" /> Quick Publish Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-xs font-medium text-gray-600">
                  Report Date
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-600">
                  Useful Actions Logged
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-600">
                  Report Due
                </TableHead>
                <TableHead className="text-xs font-medium text-gray-600">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reports.map((report) => (
                <TableRow key={report.reportId} className="hover:bg-gray-50">
                  <TableCell className="text-sm text-gray-900">
                    {report.reportDate}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {report.actionsLogged}
                  </TableCell>
                  <TableCell className="text-sm text-gray-900">
                    {report.reportDue}
                  </TableCell>
                  <TableCell>
                    {report.published ? (
                      <span className="text-xs text-gray-600">
                        {report.status}
                      </span>
                    ) : report.isOverdue ? (
                      <span className="text-xs text-red-600 font-medium">
                        Overdue
                      </span>
                    ) : (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-600 hover:text-blue-800"
                        asChild
                      >
                        <Link href={`/dashboard/reports/${report.reportId}`}>
                          Save Hours
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* View All Link */}
        <div className="mt-4 text-center">
          <Button variant="link" asChild className="text-sm text-primary">
            <Link href="/dashboard/reports">View All Available Reports</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
