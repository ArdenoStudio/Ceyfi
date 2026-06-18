"use client";

import { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[50vh] p-6">
          <Card className="border-seylan-border max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-seylan-red mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-seylan-charcoal mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                We couldn&apos;t load this page. Please try again.
              </p>
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
