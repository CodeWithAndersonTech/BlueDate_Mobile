import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCrashEntry, logCrash } from '../utils/crashLog';

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
  dump: string | null;
};

/**
 * Catches render-tree exceptions so the app can show a recovery UI
 * instead of a blank native kill when the failure is JS-side.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, dump: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    void logCrash('render', error, {
      componentStack: info.componentStack ?? '',
    }).then(entry => {
      this.setState({ dump: formatCrashEntry(entry) });
    });
  }

  private retry = () => {
    this.setState({ error: null, dump: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.root}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{this.state.error.message}</Text>
        {this.state.dump ? (
          <Text style={styles.dump} selectable>
            {this.state.dump}
          </Text>
        ) : null}
        <Pressable onPress={this.retry} style={styles.btn}>
          <Text style={styles.btnLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0B10',
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  message: {
    color: '#FF8A80',
    fontSize: 15,
    lineHeight: 22,
  },
  dump: {
    color: '#A0A0B0',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 8,
  },
  btn: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#5B5CFF',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ErrorBoundary;
