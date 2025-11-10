import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

export function FileUploadInterceptor(fieldName: string, folder: string) {
  return FileInterceptor(fieldName, {
    storage: diskStorage({
      destination: join('./uploads', folder), // dossier dynamique
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return callback(new Error('Seules les images sont autorisées!'), false);
      }
      callback(null, true);
    },
  });
}
