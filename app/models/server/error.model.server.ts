// app/models/error.model.ts
import { prop, getModelForClass, modelOptions, Severity } from '@typegoose/typegoose';

// Request info class
class RequestInfo {
  @prop({ required: true, type:String })
  public url!: string;

  @prop({ required: true, type:String })
  public method!: string;

  @prop({ type: () => Object, required: true })
  public headers!: Record<string, string>;
}

// Error document class
@modelOptions({ 
  schemaOptions: { collection: 'errors' },
  options: { allowMixed: Severity.ALLOW } // Allow mixed types in headers
})
export class ErrorLog {
  @prop({ required: true, type: Date})
  public timestamp!: Date;

  @prop({ required: true, type: String})
  public message!: string;

  @prop({type: String})
  public stack?: string;

  @prop({ required: true, type: String })
  public type!: string;

  @prop({ type: () => RequestInfo, _id: false, required: true })
  public request!: RequestInfo;
}

// Create and export the model
export const ErrorModel = getModelForClass(ErrorLog);

// Logging utility function
export async function logError(error: Error, request: Request): Promise<void> {
  try {
    // Extract useful information from request
    const url: string = request.url;
    const method: string = request.method;
    const headers: Record<string, string> = Object.fromEntries(request.headers.entries());
    
    // Create error document
    const errorLog = new ErrorModel({
      timestamp: new Date(),
      message: error.message,
      stack: error.stack,
      type: error.name,
      request: {
        url,
        method,
        headers: {
          // Only include necessary headers
          'user-agent': headers['user-agent'],
          'referer': headers['referer'],
          // Add other relevant headers as needed
        }
      }
    });
    
    await errorLog.save();
    console.log('Error logged to MongoDB');
  } catch (dbError) {
    console.error('Failed to log error to MongoDB:', dbError);
  }
}