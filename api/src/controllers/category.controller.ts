import { Router, Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { NotFoundError } from '../types/errors';

export class CategoryController {
  public path = '/categories';
  public router = Router();
  private categoryService: CategoryService;
  private productService: ProductService;

  constructor() {
    this.categoryService = new CategoryService();
    this.productService = new ProductService();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllCategories);
    this.router.get('/:categoryId/products', this.getProductsByCategory);
  }

  public getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Fetching all categories');
    try {
      const categories = await this.categoryService.getAllCategories();
      res.json(categories);
    } catch (error) {
      req.log.error('Controller Error: Error fetching categories: %s', error);
      next(error); 
    }
  }

  public getProductsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const categoryIdParam = req.params.categoryId;
      req.log.info(`Controller: Fetching products by category ID: ${categoryIdParam}`);
      try {
          const categoryId = parseInt(categoryIdParam, 10);
          if (isNaN(categoryId)) {
              res.status(400).json({ error: "Invalid category ID format" });
              return;
          }
          const products = await this.productService.getProductsByCategoryId(categoryId);
          res.json(products);
      } catch (error) {
          req.log.error(`Controller Error: Error fetching products for category ${categoryIdParam}: %s`, error);
          next(error);
      }
  }

}