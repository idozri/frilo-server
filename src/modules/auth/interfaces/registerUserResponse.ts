import { AppUserDto } from '../dto/app-user.dto';

interface RegisterUserResponse {
  isSuccess: boolean;
  user?: AppUserDto;
  message?: string;
}
export default RegisterUserResponse;
