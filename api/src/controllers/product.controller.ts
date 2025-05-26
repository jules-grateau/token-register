import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';


export class ProductController {
  public path = '/products';
  public router = Router();
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllProducts);
  }

  public getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Fetching all products');
    try {
      const products = await this.productService.getAllProducts();
      res.json(products);
    } catch (error) {
      req.log.error('Controller Error: Error fetching products: %s', error);
      next(error);
    }
  }
}