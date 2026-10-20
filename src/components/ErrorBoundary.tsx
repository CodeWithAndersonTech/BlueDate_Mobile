import React from 'react';
import { logCrash } from '../utils/crashLog';
import { RecoveryScreen } from './RecoveryScreen';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
};

/**
 * Catches render-tree exceptions so the app can show a recovery UI
 * instead of a blank native kill when the failure is JS-side.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    void logCrash('render', error, {
      componentStack: info.componentStack ?? '',
    });
  }

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return <RecoveryScreen onRetry={this.retry} />;
  }
}

export default ErrorBoundary;
