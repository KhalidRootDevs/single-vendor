'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useModal } from '@/context/modal-context';
import UserLoginForm from '../forms/auth/user-login-form';
import UserRegisterForm from '../forms/auth/user-register-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';

export function LoginModal() {
  const { isLoginModalOpen, authMode, closeAuthModal } = useModal();

  const dialogContentClass = 'sm:max-w-[480px] p-0 gap-0 bg-background border';
  const cardClass = 'bg-transparent border shadow-none';
  const textMutedClass = 'text-muted-foreground';
  const textPrimaryClass = 'text-foreground';

  return (
    <Dialog
      open={isLoginModalOpen}
      onOpenChange={(open) => !open && closeAuthModal()}
    >
      <DialogContent className={dialogContentClass}>
        {authMode === 'login' ? (
          <Card className={cardClass}>
            <CardHeader className="pb-6 text-center">
              <CardTitle className={`text-xl ${textPrimaryClass}`}>
                Welcome back
              </CardTitle>
              <CardDescription className={textMutedClass}>
                Login with your Apple or Google account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <UserLoginForm />
            </CardContent>
          </Card>
        ) : (
          <Card className={cardClass}>
            <CardHeader className="pb-6 text-center">
              <CardTitle className={`text-xl ${textPrimaryClass}`}>
                Create an account
              </CardTitle>
              <CardDescription className={textMutedClass}>
                Get started with your free account
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <UserRegisterForm />
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
