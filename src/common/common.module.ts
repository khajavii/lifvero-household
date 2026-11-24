import {I18nService} from "./i18n/i18n.service";
import {Module} from "@nestjs/common";

@Module({
    providers: [I18nService],
    exports: [I18nService],
})
export class CommonModule {}