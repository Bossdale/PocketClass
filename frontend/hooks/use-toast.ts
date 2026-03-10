import Toast from 'react-native-toast-message';

export function toast(options: {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) {
  Toast.show({
    type: options.variant === 'destructive' ? 'error' : 'success',
    text1: options.title,
    text2: options.description,
    position: 'top',
  });
}

export function useToast() {
  return {
    toast,
    dismiss: () => Toast.hide(),
  };
}