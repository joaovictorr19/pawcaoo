import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

/**
 * Feature-level error boundary for wrapping crash-prone sections.
 * Unlike the top-level ErrorBoundary, this shows a contextual inline
 * fallback instead of replacing the entire page.
 *
 * Usage:
 *   <FeatureErrorBoundary name="Map">
 *     <MapComponent />
 *   </FeatureErrorBoundary>
 */
class FeatureErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const name = this.props.name || 'Unknown';
    console.error(`[FeatureErrorBoundary:${name}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const name = this.props.name || 'this section';

      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-red-100 bg-red-50/50"
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
          <p className="text-sm text-gray-700 mb-3">
            Failed to load {name}
          </p>
          <Button
            onClick={this.handleRetry}
            variant="outline"
            size="sm"
          >
            <RefreshCcw className="w-3 h-3 mr-1.5" />
            Retry
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FeatureErrorBoundary;
