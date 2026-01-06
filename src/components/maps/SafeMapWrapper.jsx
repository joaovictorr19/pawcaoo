import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class SafeMapWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown map error' };
  }

  componentDidCatch(error, errorInfo) {
    // CRITICAL: Safe error logging without .stack.match()
    console.error('🗺️ Map Error Caught:', {
      message: error?.message || 'Unknown',
      name: error?.name || 'Error',
      stack: error?.stack ? error.stack.substring(0, 200) : 'No stack',
      componentStack: errorInfo?.componentStack ? errorInfo.componentStack.substring(0, 200) : 'No component stack'
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 z-50 bg-gray-50 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="bg-orange-50 p-4 rounded-full inline-block mb-4">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Mapa temporariamente indisponível
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Verifique a sua ligação GPS ou recarregue a página.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Recarregar Página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeMapWrapper;