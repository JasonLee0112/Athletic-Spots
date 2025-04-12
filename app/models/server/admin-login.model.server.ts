// app/models/admin-login.model.ts
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

// Admin login document class
@modelOptions({ schemaOptions: { collection: 'admin-login' } })
export class AdminLogin {
  @prop({ required: true, type: Date })
  public timestamp!: Date;

  @prop({ required: true, type: String })
  public userId!: string;

  @prop({ required: true, type: Boolean })
  public success!: boolean;

  @prop({ required: true, type: String })
  public ipAddress!: string;
}

// Create and export the model
export const AdminLoginModel = getModelForClass(AdminLogin);

// Logging utility function
export async function logAdminLogin(
  userId: string, 
  success: boolean, 
  ipAddress: string
): Promise<boolean> {
  try {
    // Create login document
    const loginLog = new AdminLoginModel({
      timestamp: new Date(),
      userId,
      success,
      ipAddress
    });
    
    await loginLog.save();
    console.log('Admin login attempt logged');
    return true;
  } catch (error) {
    console.error('Failed to log admin login:', error);
    return false;
  }
}