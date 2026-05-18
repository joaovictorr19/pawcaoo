import { isIframe } from "./utils.js";


export function setupIframeMessaging() {

	if (isIframe) {
		window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		window.removeEventListener('error', handleWindowError);

		window.addEventListener('unhandledrejection', handleUnhandledRejection);
		window.addEventListener('error', handleWindowError);
	}
}


function onAppError({ title, details, componentName, originalError }) {
	if (originalError?.response?.status === 402) {
		return;
	}
	window.parent?.postMessage({
		type: "app_error",
		error: { title: title.toString(), details: details?.toString(), componentName: componentName?.toString() }
	}, "*");
}

function handleUnhandledRejection(event) {
	const reason = event?.reason;
	const stack = typeof reason?.stack === 'string' ? reason.stack : '';
	const functionName = stack.match(/at\s+(\w+)\s+\(eval/)?.[1];
	const reasonText = reason?.toString?.() || 'Unhandled promise rejection';
	const msg = functionName ? `Error in ${functionName}: ${reasonText}` : reasonText;
	onAppError({ title: msg, details: reasonText, componentName: functionName, originalError: reason });
}

function handleWindowError(event) {
	const error = event?.error;
	const stack = typeof error?.stack === 'string' ? error.stack : '';
	let functionName = stack.match(/at\s+(\w+)\s+\(eval/)?.[1];
	if (functionName === 'eval') {
		functionName = null;
	}

	const errorText = error?.toString?.() || event?.message || 'Unknown error';
	const msg = functionName ? `in ${functionName}: ${errorText}` : errorText;
	onAppError({ title: msg, details: errorText, componentName: functionName, originalError: error || event });
}