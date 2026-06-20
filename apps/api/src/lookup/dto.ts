import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
} from "class-validator";
import type { DatingApp, LookupRequest } from "@cheatercheck/types";

const APPS: DatingApp[] = ["tinder", "bumble", "hinge", "other"];

export class LookupDto implements LookupRequest {
  @IsString()
  @IsNotEmpty({ message: "Enter a name to search." })
  fullName!: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsIn(APPS)
  app!: DatingApp;

  @IsString()
  @IsNotEmpty({ message: "Upload a clear face photo to run the scan." })
  imageData!: string;
}
