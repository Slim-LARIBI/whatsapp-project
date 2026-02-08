import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: {
    email: string;
    password: string;
    name: string;
    tenantId: string;
    role?: string;
  }) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email, tenantId: dto.tenantId },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      tenantId: dto.tenantId,
      role: dto.role || 'agent',
    });
    await this.userRepo.save(user);

    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'tenantId', 'email', 'passwordHash', 'name', 'role', 'isActive'],
    });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    // Update last login
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    return this.generateTokens(user);
  }

  async getProfile(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ['tenant'],
    });
  }

  private generateTokens(user: User) {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
