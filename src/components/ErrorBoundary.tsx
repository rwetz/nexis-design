/**
 * Catches a render error in its subtree and shows a recoverable message
 * instead of a blank window. A Tauri release build has no devtools, so an
 * uncaught render error is a white rectangle the user can only close.
 *
 *   <ErrorBoundary label="Log view" onError={(e) => report(e)} resetKey={file}>…</ErrorBoundary>
 *
 * Wrap the app once at the root (main.tsx), and any view that renders
 * external data (a parsed file, a response) on its own.
 */

import * as React from "react";
import { Icon } from "../icon/icon";
import { Button } from "./ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";

type Props = {
  children: React.ReactNode;
  /** Names what failed: "Log view" gives "Log view stopped working". */
  label?: string;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  /** Changing this clears the error, so moving to another document retries. */
  resetKey?: unknown;
  className?: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <Empty role="alert" className={this.props.className}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon name="alert-circle" />
          </EmptyMedia>
          <EmptyTitle>{this.props.label ?? "This view"} stopped working</EmptyTitle>
          <EmptyDescription>{error.message}</EmptyDescription>
        </EmptyHeader>
        <Button variant="secondary" size="sm" onClick={() => this.setState({ error: null })}>
          Try again
        </Button>
      </Empty>
    );
  }
}
