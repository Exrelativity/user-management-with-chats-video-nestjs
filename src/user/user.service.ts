import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '../model/user';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async updatePassword(userId: any, newPassword: string): Promise<void> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const password = await this.hashPassword(newPassword);
    await this.userModel.update(
      { password: password },
      { where: { id: userId } },
    );
  }

  async verifyEmail(userId: any): Promise<void> {
    const user = await this.findOneById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const isEmailVerified = true;
    await this.userModel.update(
      { isEmailVerified: isEmailVerified },
      { where: { id: userId } },
    );
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async findOneByUsername(username: string): Promise<User | undefined> {
    return this.userModel.findOne({ where: { username: username } });
  }

  async findOneById(id: string): Promise<User | undefined> {
    return this.userModel.findByPk(id);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...rest } = createUserDto;
    const hashedPassword = await this.hashPassword(password);
    const newUser = this.userModel.create({
      ...rest,
      password: hashedPassword,
    });
    return newUser;
  }

  async update(id: string, updatedUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userModel.update(updatedUserDto, {
      where: { id: id },
    });
    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const updatedUser = this.userModel.findOne({ where: { id: id } });
    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const userToRemove = await this.userModel.findOne({ where: { id: id } });
    if (!userToRemove) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await userToRemove.destroy();
  }
}
