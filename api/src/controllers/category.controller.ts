import { Router, Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { CategoryType } from 'shared-ts';
import { NotFoundError } from '../types/errors';

export class CategoryController {
  public path = '/categories';
  public router = Router();
  private readonly categoryService: CategoryService;
  private readonly productService: ProductService;

  constructor(categoryService: CategoryService, productService: ProductService) {
    this.categoryService = categoryService;
    this.productService = productService;
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getAllCategories);
    this.router.get('/:categoryId/products', this.getProductsByCategory);
    this.router.post('/', this.addCategory);
    this.router.put('/:categoryId', this.updateCategory);
    this.router.delete('/:categoryId', this.deleteCategory);
  }

  public getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    req.log.info('Controller: Fetching all categories');
    try {
      const categories = await this.categoryService.getAllCategories();
      res.json(categories);
    } catch (error) {
      req.log.error('Controller Error: Error fetching categories: %s', error);
      next(error);
    }
  };

  public getProductsByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const categoryIdParam = req.params.categoryId;
    req.log.info(`Controller: Fetching products by category ID: ${categoryIdParam}`);
    try {
      const categoryId = parseInt(categoryIdParam, 10);
      if (isNaN(categoryId)) {
        res.status(400).json({ error: 'Invalid category ID format' });
        return;
      }
      const products = await this.productService.getProductsByCategoryId(categoryId);
      res.json(products);
    } catch (error) {
      req.log.error(
        `Controller Error: Error fetching products for category ${categoryIdParam}: %s`,
        error
      );
      next(error);
    }
  };

  public addCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.log.info('Controller: Creating new category');
    try {
      const { name } = req.body as CategoryType;
      if (!name) {
        res.status(400).json({ error: 'Category name is required' });
        return;
      }
      const id = await this.categoryService.addCategory({ name });
      res.status(201).json({ id });
    } catch (error) {
      req.log.error('Controller Error: Error creating category: %s', error);
      next(error);
    }
  };

  public updateCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const categoryIdParam = req.params.categoryId;
    req.log.info(`Controller: Updating category with ID: ${categoryIdParam}`);
    try {
      const categoryId = parseInt(categoryIdParam, 10);
      if (isNaN(categoryId)) {
        res.status(400).json({ error: 'Invalid category ID format' });
        return;
      }

      const { name } = req.body as Omit<CategoryType, 'id'>;
      if (!name) {
        res.status(400).json({ error: 'Category name is required' });
        return;
      }

      await this.categoryService.updateCategory(categoryId, { name });

      res.status(204).send();
    } catch (error) {
      req.log.error(`Controller Error: Error updating category ${categoryIdParam}: %s`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  };

  public deleteCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const categoryIdParam = req.params.categoryId;
    req.log.info(`Controller: Deleting category with ID: ${categoryIdParam}`);
    try {
      const categoryId = parseInt(categoryIdParam, 10);
      if (isNaN(categoryId)) {
        res.status(400).json({ error: 'Invalid category ID format' });
        return;
      }

      await this.categoryService.deleteCategory(categoryId);

      res.status(204).send();
    } catch (error) {
      req.log.error(`Controller Error: Error deleting category ${categoryIdParam}: %s`, error);
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      next(error);
    }
  };
}
