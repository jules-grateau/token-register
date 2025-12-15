import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ProductType } from 'shared-ts';
import { NotFoundError } from '../types/errors';

export class ProductController {
  public path = '/products';
  public router = Router();
  private readonly productService: ProductService;

  constructor(productService: ProductService) {
    this.productService = productService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllProducts);
    this.router.post('/', this.createProduct);
    this.router.put('/:productId', this.updateProduct);
    this.router.delete('/:productId', this.deleteProduct);
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

  public updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const productIdParam = req.params.productId;
    req.log.info(`Controller: Updating product with ID: ${productIdParam}`);
    try {
      const productId = parseInt(productIdParam, 10);
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid product ID format' });
        return;
      }

      const productUpdate: Partial<Omit<ProductType, 'id'>> = req.body as Partial<
        Omit<ProductType, 'id'>
      >;
      if (Object.keys(productUpdate).length === 0) {
        res.status(400).json({ error: 'At least one field to update must be provided' });
        return;
      }

      await this.productService.updateProduct(productId, productUpdate);

      res.status(204).send();
    } catch (error) {
      req.log.error(`Controller Error: Error updating product ${productIdParam}: %s`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  };

  public deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const productIdParam = req.params.productId;
    req.log.info(`Controller: Deleting product with ID: ${productIdParam}`);
    try {
      const productId = parseInt(productIdParam, 10);
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid product ID format' });
        return;
      }

      await this.productService.deleteProduct(productId);

      res.status(204).send();
    } catch (error) {
      req.log.error(`Controller Error: Error deleting product ${productIdParam}: %s`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  };
}
