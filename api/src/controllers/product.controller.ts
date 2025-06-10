import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ProductType } from 'shared-ts';

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
    this.router.post('/', this.createProduct);
  }

  public getAllProducts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    req.log.info('Controller: Fetching all products');
    try {
      const products = await this.productService.getAllProducts();
      res.json(products);
    } catch (error) {
      req.log.error('Controller Error: Error fetching products: %s', error);
      next(error);
    }
  };

  public createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Creating new product');
    try {
      const { name, price, categoryId } = req.body as ProductType;
      if (!name || typeof price !== 'number' || !categoryId) {
        res.status(400).json({ error: 'Missing or invalid product fields' });
        return;
      }
      const id = await this.productService.addProduct({ name, price, categoryId });
      res.status(201).json({ id });
    } catch (error) {
      req.log.error('Controller Error: Error creating product: %s', error);
      next(error);
    }
  };
}
