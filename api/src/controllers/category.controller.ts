import { Router, Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import { CategoryType } from 'shared-ts';
import { NotFoundError } from '../types/errors';
import { INVALID_ICON_MESSAGE, isValidIconField } from '../utils/catalogIcons';
import { requirePermission } from '../middleware/auth';

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
    // D-063: reading the catalog is part of the sale; changing it needs "catalog".
    this.router.get('/', requirePermission('sale'), this.getAllCategories);
    this.router.get('/:categoryId/products', requirePermission('sale'), this.getProductsByCategory);
    this.router.post('/', requirePermission('catalog'), this.addCategory);
    this.router.put('/:categoryId', requirePermission('catalog'), this.updateCategory);
    this.router.delete('/:categoryId', requirePermission('catalog'), this.deleteCategory);
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
      const { name, icon } = req.body as CategoryType;
      if (!name) {
        res.status(400).json({ error: 'Category name is required' });
        return;
      }
      // D-047: the icon is optional; when given, it must be a known key.
      if (!isValidIconField(icon)) {
        res.status(400).json({ error: INVALID_ICON_MESSAGE });
        return;
      }
      const id = await this.categoryService.addCategory({ name, icon: icon ?? null });
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

      const { name, icon } = req.body as Omit<CategoryType, 'id'>;
      if (!name) {
        res.status(400).json({ error: 'Category name is required' });
        return;
      }
      if (!isValidIconField(icon)) {
        res.status(400).json({ error: INVALID_ICON_MESSAGE });
        return;
      }

      // A missing icon keeps the current one; null removes it.
      await this.categoryService.updateCategory(
        categoryId,
        icon === undefined ? { name } : { name, icon }
      );

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
