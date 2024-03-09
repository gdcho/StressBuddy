import GoogleLoginButton from "@/components/shared/buttons/google-login";
export default function Login() {
  return (
    <div className="flex flex-col items-center justify-around h-screen">
      <GoogleLoginButton />
    </div>
  );
}